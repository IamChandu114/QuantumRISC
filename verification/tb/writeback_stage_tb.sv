`timescale 1ns / 1ps

module writeback_stage_tb;

logic MemtoReg;

logic [31:0] memory_data;
logic [31:0] alu_result;

logic [31:0] writeback_data;

writeback_stage DUT(

    .MemtoReg(MemtoReg),
    .memory_data(memory_data),
    .alu_result(alu_result),
    .writeback_data(writeback_data)

);

initial begin

    $display("------------------------------");
    $display("Write Back Stage Test");
    $display("------------------------------");

    // ALU Result
    MemtoReg   = 0;
    alu_result = 32'd30;
    memory_data= 32'd100;

    #10;

    if(writeback_data == 32'd30)
        $display("[PASS] ALU Write Back");
    else
        $display("[FAIL] ALU Write Back");

    // Memory Result
    MemtoReg = 1;

    #10;

    if(writeback_data == 32'd100)
        $display("[PASS] Memory Write Back");
    else
        $display("[FAIL] Memory Write Back");

    $display("------------------------------");

    $finish;

end

endmodule