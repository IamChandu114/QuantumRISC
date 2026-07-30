`timescale 1ns / 1ps

module execute_stage_tb;

logic [31:0] rs1_data;
logic [31:0] rs2_data;
logic [31:0] immediate;

logic ALUSrc;

logic [3:0] alu_control;

logic [31:0] alu_result;
logic zero;

execute_stage DUT(

    .rs1_data(rs1_data),
    .rs2_data(rs2_data),
    .immediate(immediate),

    .ALUSrc(ALUSrc),

    .alu_control(alu_control),

    .alu_result(alu_result),
    .zero(zero)

);

initial begin

    $display("------------------------------");
    $display("Execute Stage Test");
    $display("------------------------------");

    rs1_data=10;
    rs2_data=20;
    immediate=5;

    ALUSrc=0;
    alu_control=4'b0000;

    #10;

    if(alu_result==30)
        $display("[PASS] Register ADD");
    else
        $display("[FAIL] Register ADD");

    ALUSrc=1;

    #10;

    if(alu_result==15)
        $display("[PASS] Immediate ADD");
    else
        $display("[FAIL] Immediate ADD");

    $display("------------------------------");

    $finish;

end

endmodule